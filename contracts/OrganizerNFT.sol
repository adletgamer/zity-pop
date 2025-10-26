// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title OrganizerNFT
 * @notice NFT de identidad para organizadores en ZITY.POP
 * @dev Soul-bound token (no transferible) con sistema de reputación
 */
contract OrganizerNFT is ERC721, ERC721URIStorage, Ownable {
    using Strings for uint256;

    // ==================== STATE VARIABLES ====================
    
    /// @notice Contador de tokens
    uint256 private _nextTokenId;
    
    /// @notice Mapeo de wallet a tokenId
    mapping(address => uint256) public organizerToToken;
    
    /// @notice Mapeo de tokenId a datos del organizador
    mapping(uint256 => OrganizerData) public organizerData;
    
    /// @notice Verificación de organizadores
    mapping(uint256 => bool) public isVerified;
    
    /// @notice Estructura de datos del organizador
    struct OrganizerData {
        string name;
        string organizationType; // DAO, Empresa, ONG, Individual
        uint256 eventsCreated;
        uint256 totalRaised;
        uint256 reputation; // 0-100
        uint256 registeredAt;
        bool active;
    }
    
    // ==================== EVENTS ====================
    
    event OrganizerRegistered(
        address indexed organizer,
        uint256 indexed tokenId,
        string name,
        uint256 timestamp
    );
    
    event OrganizerVerified(uint256 indexed tokenId, uint256 timestamp);
    event ReputationUpdated(uint256 indexed tokenId, uint256 newReputation);
    event EventCompleted(uint256 indexed tokenId, uint256 fundsRaised);
    
    // ==================== ERRORS ====================
    
    error AlreadyRegistered();
    error NotRegistered();
    error InvalidData();
    error TokenNotTransferable();
    
    // ==================== CONSTRUCTOR ====================
    
    constructor() ERC721("ZITY.POP Organizer Badge", "ZITYORG") Ownable(msg.sender) {
        _nextTokenId = 1; // Empezar desde 1
    }
    
    // ==================== EXTERNAL FUNCTIONS ====================
    
    /**
     * @notice Registra un nuevo organizador y mintea su NFT
     * @param _name Nombre del organizador
     * @param _organizationType Tipo de organización
     */
    function registerOrganizer(
        string memory _name,
        string memory _organizationType
    ) external returns (uint256) {
        if (organizerToToken[msg.sender] != 0) revert AlreadyRegistered();
        if (bytes(_name).length == 0) revert InvalidData();
        
        uint256 tokenId = _nextTokenId++;
        
        // Mint NFT
        _safeMint(msg.sender, tokenId);
        
        // Guardar datos
        organizerToToken[msg.sender] = tokenId;
        organizerData[tokenId] = OrganizerData({
            name: _name,
            organizationType: _organizationType,
            eventsCreated: 0,
            totalRaised: 0,
            reputation: 0,
            registeredAt: block.timestamp,
            active: true
        });
        
        // Set metadata URI (puede ser dinámico)
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit OrganizerRegistered(msg.sender, tokenId, _name, block.timestamp);
        
        return tokenId;
    }
    
    /**
     * @notice Verifica a un organizador (solo owner)
     * @param _tokenId ID del token a verificar
     */
    function verifyOrganizer(uint256 _tokenId) external onlyOwner {
        if (!_exists(_tokenId)) revert NotRegistered();
        
        isVerified[_tokenId] = true;
        
        // Bonus de reputación por verificación
        organizerData[_tokenId].reputation += 10;
        if (organizerData[_tokenId].reputation > 100) {
            organizerData[_tokenId].reputation = 100;
        }
        
        emit OrganizerVerified(_tokenId, block.timestamp);
    }
    
    /**
     * @notice Actualiza estadísticas cuando se completa un evento
     * @param _organizer Dirección del organizador
     * @param _fundsRaised Fondos recaudados en el evento
     */
    function recordEventCompleted(
        address _organizer,
        uint256 _fundsRaised
    ) external onlyOwner {
        uint256 tokenId = organizerToToken[_organizer];
        if (tokenId == 0) revert NotRegistered();
        
        OrganizerData storage data = organizerData[tokenId];
        data.eventsCreated++;
        data.totalRaised += _fundsRaised;
        
        // Incrementar reputación basado en éxito
        uint256 reputationGain = _calculateReputationGain(_fundsRaised);
        data.reputation += reputationGain;
        if (data.reputation > 100) {
            data.reputation = 100;
        }
        
        // Actualizar metadata
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        
        emit EventCompleted(tokenId, _fundsRaised);
        emit ReputationUpdated(tokenId, data.reputation);
    }
    
    /**
     * @notice Actualiza la reputación manualmente (solo owner)
     * @param _tokenId ID del token
     * @param _newReputation Nueva reputación (0-100)
     */
    function updateReputation(uint256 _tokenId, uint256 _newReputation) external onlyOwner {
        if (!_exists(_tokenId)) revert NotRegistered();
        if (_newReputation > 100) revert InvalidData();
        
        organizerData[_tokenId].reputation = _newReputation;
        
        // Actualizar metadata
        _setTokenURI(tokenId, _generateTokenURI(_tokenId));
        
        emit ReputationUpdated(_tokenId, _newReputation);
    }
    
    // ==================== VIEW FUNCTIONS ====================
    
    /**
     * @notice Obtiene el tokenId de un organizador
     */
    function getOrganizerToken(address _organizer) external view returns (uint256) {
        return organizerToToken[_organizer];
    }
    
    /**
     * @notice Obtiene los datos completos de un organizador
     */
    function getOrganizerData(uint256 _tokenId) external view returns (
        string memory name,
        string memory organizationType,
        uint256 eventsCreated,
        uint256 totalRaised,
        uint256 reputation,
        uint256 registeredAt,
        bool verified,
        bool active
    ) {
        OrganizerData memory data = organizerData[_tokenId];
        return (
            data.name,
            data.organizationType,
            data.eventsCreated,
            data.totalRaised,
            data.reputation,
            data.registeredAt,
            isVerified[_tokenId],
            data.active
        );
    }
    
    /**
     * @notice Obtiene el nivel de reputación (Bronze, Silver, Gold, Diamond)
     */
    function getReputationLevel(uint256 _tokenId) external view returns (string memory) {
        uint256 rep = organizerData[_tokenId].reputation;
        
        if (rep >= 80) return "Diamond";
        if (rep >= 60) return "Gold";
        if (rep >= 40) return "Silver";
        return "Bronze";
    }
    
    /**
     * @notice Verifica si una dirección es un organizador registrado
     */
    function isOrganizer(address _address) external view returns (bool) {
        return organizerToToken[_address] != 0;
    }
    
    /**
     * @notice Obtiene el total de organizadores registrados
     */
    function totalOrganizers() external view returns (uint256) {
        return _nextTokenId - 1;
    }
    
    // ==================== INTERNAL FUNCTIONS ====================
    
    /**
     * @notice Genera URI dinámica con metadata on-chain
     */
    function _generateTokenURI(uint256 _tokenId) internal view returns (string memory) {
        OrganizerData memory data = organizerData[_tokenId];
        
        // En producción, esto debería apuntar a IPFS o un servidor
        // Por ahora retornamos un placeholder
        string memory json = string(
            abi.encodePacked(
                '{"name": "',
                data.name,
                ' - ZITY.POP Organizer",',
                '"description": "Organizador verificado en ZITY.POP",',
                '"attributes": [',
                    '{"trait_type": "Reputation", "value": ', data.reputation.toString(), '},',
                    '{"trait_type": "Events Created", "value": ', data.eventsCreated.toString(), '},',
                    '{"trait_type": "Total Raised", "value": "', (data.totalRaised / 1e18).toString(), ' ETH"},',
                    '{"trait_type": "Verified", "value": "', isVerified[_tokenId] ? 'Yes' : 'No', '"}',
                ']}'
            )
        );
        
        return string(abi.encodePacked("data:application/json;base64,", _base64Encode(bytes(json))));
    }
    
    /**
     * @notice Calcula ganancia de reputación basada en fondos recaudados
     */
    function _calculateReputationGain(uint256 _fundsRaised) internal pure returns (uint256) {
        // 1 ETH = 5 puntos de reputación
        // 10 ETH = 10 puntos
        // 50+ ETH = 15 puntos
        if (_fundsRaised >= 50 ether) return 15;
        if (_fundsRaised >= 10 ether) return 10;
        if (_fundsRaised >= 1 ether) return 5;
        return 2;
    }
    
    /**
     * @notice Verifica si un token existe
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
    
    /**
     * @notice Codifica a Base64 (simple implementation)
     */
    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        string memory result = new string(encodedLen + 32);
        
        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)
            
            for {
                let i := 0
            } lt(i, mload(data)) {
                i := add(i, 3)
            } {
                let input := mload(add(data, add(i, 32)))
                
                mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
                resultPtr := add(resultPtr, 1)
                mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
                resultPtr := add(resultPtr, 1)
            }
            
            mstore(result, encodedLen)
        }
        
        return result;
    }
    
    // ==================== OVERRIDE FUNCTIONS ====================
    
    /**
     * @notice Previene transferencias (Soul-bound)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Permitir mint (from == address(0))
        // Bloquear transfers (from != address(0) && to != address(0))
        if (from != address(0) && to != address(0)) {
            revert TokenNotTransferable();
        }
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @notice Override requerido por Solidity
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @notice Override requerido por Solidity
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}